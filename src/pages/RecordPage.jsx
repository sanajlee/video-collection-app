import faceShoulderGuide from "../assets/guides/face-shoulder-guide.PNG";
import { useRef, useState } from "react";

function getSupportedMimeType() {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/mp4;codecs=avc1,mp4a.40.2",
    "video/webm",
    "video/mp4",
  ];

  return (
    candidates.find((type) =>
      MediaRecorder.isTypeSupported(type)
    ) || ""
  );
}

export default function RecordPage({ onBack }) {
  const videoRef = useRef(null);
  const previewRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState(null);

  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingMetadata, setRecordingMetadata] = useState(null);
  const [mimeType, setMimeType] = useState("");

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: {
          channelCount: 1,
          sampleRate: { ideal: 48000 },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      streamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      const selectedMimeType = getSupportedMimeType();

      setMimeType(selectedMimeType);

      setRecordingMetadata({
        createdAt: new Date().toISOString(),

        video: videoTrack
          ? videoTrack.getSettings()
          : null,

        audio: audioTrack
          ? audioTrack.getSettings()
          : null,

        requested: {
          width: 1920,
          height: 1080,
          frameRate: 30,
          audioSampleRate: 48000,
        },

        mimeType: selectedMimeType,
      });

      console.log("Video settings:", videoTrack?.getSettings());
      console.log("Audio settings:", audioTrack?.getSettings());
      console.log("MIME type:", selectedMimeType);


      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsCameraReady(true);
    } catch (error) {
      console.error(error);
      alert("카메라/마이크 권한을 확인해 주세요.");
    }
  }

  function startRecording() {
    if (!streamRef.current) return;

    chunksRef.current = [];

    const options = {
      videoBitsPerSecond: 5_000_000,
      audioBitsPerSecond: 128_000,
    };

    if (mimeType) {
      options.mimeType = mimeType;
    }

    const recorder = new MediaRecorder(
      streamRef.current,
      options
    );

    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const actualMimeType =
        recorder.mimeType ||
        mimeType ||
        "video/webm";

      const blob = new Blob(chunksRef.current, {
        type: actualMimeType,
      });

      setRecordedBlob(blob);

      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);

      if (previewRef.current) {
        previewRef.current.src = url;
      }

      setRecordingMetadata((prev) => ({
        ...prev,
        finishedAt: new Date().toISOString(),
        mimeType: actualMimeType,
        fileSizeBytes: blob.size,
      }));

      console.log("Recorded blob:", blob);
    };

    recorder.start();
    setIsRecording(true);
  }

  function stopRecording() {
    if (recorderRef.current) {
      recorderRef.current.stop();
    }

    setIsRecording(false);
  }

  function retake() {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }

    setRecordedBlob(null);
    setRecordingMetadata((prev) => ({
      ...prev,
      finishedAt: null,
      fileSizeBytes: null,
    }));

    setRecordedUrl(null);
    chunksRef.current = [];
  }


  function getFileExtension(type) {
    if (type?.includes("mp4")) return "mp4";
    return "webm";
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    // click 직후 revoke하면 모바일에서 실패할 수 있어서 약간 늦춤
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  async function submitVideo() {
    if (!recordedBlob) {
      alert("녹화된 영상이 없습니다.");
      return;
    }

    try {
      const formData = new FormData();

      const extension =
        recordedBlob.type?.includes("mp4")
          ? "mp4"
          : "webm";

      formData.append(
        "video",
        recordedBlob,
        `recording.${extension}`
      );

      formData.append(
        "metadata",
        JSON.stringify(recordingMetadata || {})
      );

      const response = await fetch(
        // "http://192.168.45.148:8000/api/recordings",
        "/api/recordings",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Upload failed: ${response.status}`
        );
      }

      const result = await response.json();

      console.log("Upload result:", result);

      alert("업로드 완료!");
    } catch (error) {
      console.error(error);
      alert("업로드에 실패했습니다.");
    }
  }

  function downloadVideo() {
    if (!recordedBlob) return;

    const extension = getFileExtension(
      recordedBlob.type || mimeType
    );

    downloadBlob(
      recordedBlob,
      `pilot_test.${extension}`
    );
  }

  function downloadMetadata() {
    const extension = getFileExtension(
      recordedBlob?.type || mimeType
    );

    const metadata = {
      ...(recordingMetadata || {}),
      file: recordedBlob
        ? {
            name: `pilot_test.${extension}`,
            type: recordedBlob.type,
            sizeBytes: recordedBlob.size,
          }
        : null,
      savedAt: new Date().toISOString(),
    };

    const blob = new Blob(
      [JSON.stringify(metadata, null, 2)],
      {
        type: "application/json;charset=utf-8",
      }
    );

    downloadBlob(blob, "pilot_test.json");
  }

  return (
    <main className="record-page">
      <section className="instruction-panel">
        <button className="back-button" onClick={onBack}>
          ← 처음으로
        </button>

        <div>
          <p className="step-label">STEP 1</p>
          <h1 className="record-title">안내에 따라 촬영해 주세요</h1>

          <p className="record-description">
            화면 아래쪽의 가이드 영역에 얼굴을 맞춘 뒤, 준비가 되면 촬영을
            시작해 주세요.
          </p>
        </div>

        <div className="instruction-box">
          <p className="instruction-title">촬영 지시문</p>
          <p className="instruction-content">
            여기에 실험/과제별 instruction이 들어갑니다. 예: “화면을 바라보고
            제시된 문장을 자연스럽게 읽어 주세요.”
          </p>
        </div>

        <div className="status-row">
          <span className="status-badge">
            {isRecording ? "촬영 중" : recordedUrl ? "미리보기" : "대기 중"}
          </span>

          {isRecording && <span className="recording-dot">● REC</span>}
        </div>
      </section>

      <section className="camera-panel">
        <div className="video-wrapper">
          {!recordedUrl ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="camera-video camera-video-live"
              />

              <div className="guide-overlay">
                <img
                  src={faceShoulderGuide}
                  className="guide-image"
                  alt=""
                />
                <p className="guide-text">얼굴과 어깨를 가이드에 맞춰 주세요</p>
              </div>
            </>
          ) : (
            <video
              ref={previewRef}
              src={recordedUrl}
              controls
              playsInline
              className="camera-video"
            />
          )}
        </div>

        <div className="button-bar">
          {!isCameraReady && !recordedUrl && (
            <button className="primary-button" onClick={startCamera}>
              카메라 켜기
            </button>
          )}

          {isCameraReady && !isRecording && !recordedUrl && (
            <button className="primary-button" onClick={startRecording}>
              촬영 시작
            </button>
          )}

          {isRecording && (
            <button className="danger-button" onClick={stopRecording}>
              촬영 종료
            </button>
          )}

          {recordedUrl && (
            <>
              <button className="secondary-button" onClick={retake}>
                다시 촬영
              </button>
              <button className="primary-button" onClick={submitVideo}>
                제출하기
              </button>

              <button onClick={downloadVideo}>
                영상 다운로드
              </button>

              <button onClick={downloadMetadata}>
                메타데이터 다운로드
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}