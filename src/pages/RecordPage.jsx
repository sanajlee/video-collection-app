import faceShoulderGuide from "../assets/guides/face-shoulder-guide.PNG";
import { useRef, useState } from "react";

export default function RecordPage({ onBack }) {
  const videoRef = useRef(null);
  const previewRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState(null);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
        },
        audio: true,
      });

      streamRef.current = stream;

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

    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: "video/webm",
    });

    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: "video/webm",
      });

      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);

      if (previewRef.current) {
        previewRef.current.src = url;
      }
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

    setRecordedUrl(null);
    chunksRef.current = [];
  }

  async function submitVideo() {
    alert("나중에 여기에 Supabase 업로드 로직을 붙이면 됩니다.");
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
                className="camera-video"
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
            </>
          )}
        </div>
      </section>
    </main>
  );
}