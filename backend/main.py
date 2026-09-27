from pathlib import Path
import json
import shutil
from datetime import datetime
import os
import socket
import paramiko

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware


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


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/recordings")
async def upload_recording(
    video: UploadFile = File(...),
    metadata: str = Form(...),
):
    try:
        metadata_dict = json.loads(metadata)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Invalid metadata JSON",
        )


    participant_id = metadata_dict.get("participantId", "unknown")

    task_id = (
        metadata_dict
        .get("task", {})
        .get("id", "unknown")
    )

    item_id = (
        metadata_dict
        .get("item", {})
        .get("id", "unknown")
    )

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
   
    base_name = (
        f"{participant_id}_"
        f"{item_id}_"
        f"{timestamp}"
    )

    # pilot 단계에서는 임시 filename
    extension = Path(video.filename or "").suffix or ".webm"

    # base_name = f"pilot_{timestamp}"

    video_path = DATA_DIR / f"{base_name}{extension}"
    metadata_path = DATA_DIR / f"{base_name}.json"

    with video_path.open("wb") as buffer:
        shutil.copyfileobj(video.file, buffer)

    metadata_dict["server"] = {
        "receivedAt": datetime.now().isoformat(),
        "videoFilename": video_path.name,
    }

    metadata_path.write_text(
        json.dumps(
            metadata_dict,
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    return {
        "success": True,
        "video": video_path.name,
        "metadata": metadata_path.name,
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
        with socket.create_connection(
            (host, port),
            timeout=5,
        ):
            return {
                "reachable": True,
            }

    except Exception as e:
        return {
            "reachable": False,
            "error": type(e).__name__,
            "message": str(e),
        }


@app.get("/debug/nas-sftp")
def check_nas_sftp():
    host = os.environ["NAS_HOST"]
    port = int(os.environ["NAS_PORT"])
    username = os.environ["NAS_USERNAME"]
    password = os.environ["NAS_PASSWORD"]

    try:
        transport = paramiko.Transport((host, port))
        transport.connect(
            username=username,
            password=password,
        )

        sftp = paramiko.SFTPClient.from_transport(transport)

        cwd = sftp.getcwd()
        files = sftp.listdir(".")

        sftp.close()
        transport.close()

        return {
            "authenticated": True,
            "cwd": cwd,
            "files": files[:20],
        }

    except Exception as e:
        return {
            "authenticated": False,
            "error": type(e).__name__,
            "message": str(e),
        }