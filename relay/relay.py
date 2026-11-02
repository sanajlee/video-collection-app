import os
import tempfile
from typing import Optional

import paramiko
from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException

app = FastAPI()

RELAY_TOKEN = os.environ["RELAY_TOKEN"]

NAS_HOST = os.environ["NAS_INTERNAL_HOST"]
NAS_PORT = int(os.environ.get("NAS_INTERNAL_PORT", "22"))
NAS_USERNAME = os.environ["NAS_USERNAME"]
NAS_PASSWORD = os.environ["NAS_PASSWORD"]
NAS_REMOTE_DIR = os.environ["NAS_REMOTE_DIR"]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/upload")
async def upload(
    video: UploadFile = File(...),
    metadata: str = Form(...),
    authorization: Optional[str] = Header(default=None),
):
    if authorization != f"Bearer {RELAY_TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized")

    filename = video.filename or "recording.webm"

    with tempfile.NamedTemporaryFile(delete=False) as temp:
        temp.write(await video.read())
        temp_path = temp.name

    try:
        transport = paramiko.Transport((NAS_HOST, NAS_PORT))
        transport.connect(
            username=NAS_USERNAME,
            password=NAS_PASSWORD,
        )

        sftp = paramiko.SFTPClient.from_transport(transport)

        remote_video = f"{NAS_REMOTE_DIR}/{filename}"
        remote_json = (
            f"{NAS_REMOTE_DIR}/"
            f"{filename.rsplit('.', 1)[0]}.json"
        )

        sftp.put(temp_path, remote_video)

        with sftp.open(remote_json, "w") as f:
            f.write(metadata)

        sftp.close()
        transport.close()

    finally:
        if os.path.exists(temp_path):
            os.unlink(temp_path)

    return {
        "success": True,
        "filename": filename,
    }