from pathlib import Path
import json
import shutil
from datetime import datetime
import os
import socket
import paramiko
import urllib.request

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import httpx


app = FastAPI()

# 개발 중에는 React dev server 접근 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

RELAY_URL = os.environ.get("RELAY_URL")
RELAY_TOKEN = os.environ.get("RELAY_TOKEN")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/recordings")
async def upload_recording(
    video: UploadFile = File(...),
    metadata: str = Form(...),
):
    video_bytes = await video.read()

    # -------------------------
    # 1. Render local 저장
    # -------------------------

    os.makedirs("data", exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    try:
        metadata_obj = json.loads(metadata)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid metadata JSON")

    participant_id = metadata_obj.get("participantId", "unknown")
    item_id = metadata_obj.get("item", {}).get("id", "unknown")

    base_name = f"{participant_id}_{item_id}_{timestamp}"

    video_path = os.path.join(
        "data",
        f"{base_name}.webm",
    )

    metadata_path = os.path.join(
        "data",
        f"{base_name}.json",
    )

    with open(video_path, "wb") as f:
        f.write(video_bytes)

    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(
            metadata_obj,
            f,
            ensure_ascii=False,
            indent=2,
        )

    # -------------------------
    # 2. Mac relay로 전송
    # -------------------------

    if not RELAY_URL or not RELAY_TOKEN:
        raise HTTPException(
            status_code=500,
            detail="Relay configuration missing",
        )

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                f"{RELAY_URL}/upload",
                headers={
                    "Authorization": f"Bearer {RELAY_TOKEN}",
                },
                files={
                    "video": (
                        f"{base_name}.webm",
                        video_bytes,
                        video.content_type or "video/webm",
                    ),
                },
                data={
                    "metadata": json.dumps(
                        metadata_obj,
                        ensure_ascii=False,
                    ),
                },
            )

        response.raise_for_status()

    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Relay upload failed: {str(e)}",
        )

    return {
        "success": True,
        "filename": f"{base_name}.webm",
        "relay": "ok",
    }


@app.get("/debug/files")
def list_files():
    return {
        "files": [
            p.name
            for p in DATA_DIR.iterdir()
            if p.is_file()
        ]
    }
    
@app.get("/debug/nas-port")
def check_nas_port():
    host = os.environ["NAS_HOST"]
    port = int(os.environ["NAS_PORT"])

    try:
        resolved = socket.getaddrinfo(
            host,
            port,
            type=socket.SOCK_STREAM,
        )

        addresses = list({
            item[4][0]
            for item in resolved
        })

        with socket.create_connection(
            (host, port),
            timeout=5,
        ):
            return {
                "reachable": True,
                "host": host,
                "resolvedAddresses": addresses,
            }

    except Exception as e:
        return {
            "reachable": False,
            "host": host,
            "resolvedAddresses": addresses if "addresses" in locals() else [],
            "error": type(e).__name__,
            "message": str(e),
        }


@app.get("/debug/outbound-ip")
def get_outbound_ip():
    try:
        with urllib.request.urlopen(
            "https://api.ipify.org?format=json",
            timeout=5,
        ) as response:
            return json.loads(response.read().decode())

    except Exception as e:
        return {
            "error": type(e).__name__,
            "message": str(e),
        }

@app.get("/debug/relay")
async def debug_relay():
    if not RELAY_URL:
        raise HTTPException(status_code=500, detail="RELAY_URL is not set")

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(f"{RELAY_URL}/health")

    return {
        "status_code": response.status_code,
        "body": response.json(),
    }