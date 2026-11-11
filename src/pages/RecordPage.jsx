import faceShoulderGuide from "../assets/guides/face-shoulder-guide.PNG";
import { useEffect, useRef, useState } from "react";



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

const RECORD_FPS = 30;

export default function RecordPage({
  onBack,
  participantId,
  task,
  item,
  onComplete,
}) {
  const videoRef = useRef(null);
  const previewRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const recordedUrlRef = useRef(null);
  const recordCanvasRef = useRef(null);
  const captureAreaRef = useRef(null);
  const cropAnimationRef = useRef(null);
  const canvasStreamRef = useRef(null);

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState(null);

  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingMetadata, setRecordingMetadata] = useState(null);
  const [mimeType, setMimeType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (cropAnimationRef.current) {
        cancelAnimationFrame(cropAnimationRef.current);
        cropAnimationRef.current = null;
      }

      if (canvasStreamRef.current) {
        canvasStreamRef.current
          .getVideoTracks()
          .forEach((track) => track.stop());
        canvasStreamRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
      }

      if (recordedUrlRef.current) {
        URL.revokeObjectURL(recordedUrlRef.current);
        recordedUrlRef.current = null;
      }
    };
  }, []);

  // 다음 item으로 넘어갈 때 녹화 결과만 초기화하고 카메라 스트림은 유지한다.
  useEffect(() => {
    stopCropDrawing();

    if (recordedUrlRef.current) {
      URL.revokeObjectURL(recordedUrlRef.current);
      recordedUrlRef.current = null;
    }

    setRecordedUrl(null);
    setRecordedBlob(null);
    setIsRecording(false);
    setIsSubmitting(false);
    chunksRef.current = [];

    setRecordingMetadata((prev) =>
      prev
        ? {
            ...prev,
            createdAt: new Date().toISOString(),
            finishedAt: null,
            fileSizeBytes: null,
          }
        : prev
    );

    if (previewRef.current) {
      previewRef.current.pause();
      previewRef.current.removeAttribute("src");
      previewRef.current.load();
    }

    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [item.id]);

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

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const videoSettings =
        stream.getVideoTracks()[0]?.getSettings();

      const audioSettings =
        stream.getAudioTracks()[0]?.getSettings();

      const selectedMimeType = getSupportedMimeType();

      setMimeType(selectedMimeType);

      setRecordingMetadata({
        createdAt: new Date().toISOString(),

        video: {
          width: videoSettings?.width,
          height: videoSettings?.height,
          frameRate: videoSettings?.frameRate,
          aspectRatio: videoSettings?.aspectRatio,
          facingMode: videoSettings?.facingMode,
        },

        audio: {
          sampleRate: audioSettings?.sampleRate,
          channelCount: audioSettings?.channelCount,
          echoCancellation: audioSettings?.echoCancellation,
          noiseSuppression: audioSettings?.noiseSuppression,
          autoGainControl: audioSettings?.autoGainControl,
        },

        mimeType: selectedMimeType,
      });

      setIsCameraReady(true);
    } catch (error) {
      console.error("Camera initialization failed:", error);
      setIsCameraReady(false);
    }
  }


  function stopCropDrawing() {
    if (cropAnimationRef.current) {
      cancelAnimationFrame(cropAnimationRef.current);
      cropAnimationRef.current = null;
    }

    if (canvasStreamRef.current) {
      canvasStreamRef.current
        .getVideoTracks()
        .forEach((track) => track.stop());
      canvasStreamRef.current = null;
    }
  }

  function startRecording() {
    if (!streamRef.current || !videoRef.current) {
      alert("카메라가 준비되지 않았습니다.");
      return;
    }

    const video = videoRef.current;
    const canvas = recordCanvasRef.current;

    if (!canvas || typeof canvas.captureStream !== "function") {
      alert("이 브라우저에서는 부분 화면 녹화를 지원하지 않습니다.");
      return;
    }

    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;

    if (!sourceWidth || !sourceHeight) {
      alert("카메라 영상이 아직 준비 중입니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    chunksRef.current = [];

    if (recordedUrlRef.current) {
      URL.revokeObjectURL(recordedUrlRef.current);
      recordedUrlRef.current = null;
    }

    setRecordedUrl(null);
    setRecordedBlob(null);

    const captureArea = captureAreaRef.current;

    if (!captureArea) {
      alert("촬영 영역을 확인하지 못했습니다.");
      return;
    }

    // 화면에 실제 보이는 video-wrapper의 종횡비를 기준으로
    // 원본 카메라 프레임에서 동일한 영역을 계산한다.
    // preview는 object-fit: cover / object-position: center를 사용한다.
    const captureRect = captureArea.getBoundingClientRect();

    if (!captureRect.width || !captureRect.height) {
      alert("촬영 영역의 크기를 확인하지 못했습니다.");
      return;
    }

    const frameAspect =
      captureRect.width / captureRect.height;
    const sourceAspect =
      sourceWidth / sourceHeight;

    let sourceX = 0;
    let sourceY = 0;
    let cropWidth = sourceWidth;
    let cropHeight = sourceHeight;

    if (sourceAspect > frameAspect) {
      // 원본이 화면보다 더 넓음 → 좌우를 잘라낸다.
      cropWidth = sourceHeight * frameAspect;
      sourceX = (sourceWidth - cropWidth) / 2;
    } else if (sourceAspect < frameAspect) {
      // 원본이 화면보다 더 높음 → 위아래를 잘라낸다.
      cropHeight = sourceWidth / frameAspect;
      sourceY = (sourceHeight - cropHeight) / 2;
    }

    // 인코더 호환성을 위해 좌표와 출력 크기를 짝수로 맞춘다.
    sourceX = Math.max(
      0,
      Math.floor(sourceX / 2) * 2
    );
    sourceY = Math.max(
      0,
      Math.floor(sourceY / 2) * 2
    );
    cropWidth = Math.min(
      sourceWidth - sourceX,
      Math.floor(cropWidth / 2) * 2
    );
    cropHeight = Math.min(
      sourceHeight - sourceY,
      Math.floor(cropHeight / 2) * 2
    );

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const ctx = canvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
    });

    if (!ctx) {
      alert("녹화 화면을 준비하지 못했습니다.");
      return;
    }

    function drawCroppedFrame() {
      ctx.drawImage(
        video,
        sourceX,
        sourceY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      cropAnimationRef.current = requestAnimationFrame(
        drawCroppedFrame
      );
    }

    drawCroppedFrame();

    const canvasStream = canvas.captureStream(RECORD_FPS);
    canvasStreamRef.current = canvasStream;

    const canvasVideoTrack = canvasStream.getVideoTracks()[0];
    const audioTracks = streamRef.current.getAudioTracks();

    const recordingStream = new MediaStream([
      canvasVideoTrack,
      ...audioTracks,
    ]);

    const options = {
      videoBitsPerSecond: 5_000_000,
      audioBitsPerSecond: 128_000,
    };

    if (mimeType) {
      options.mimeType = mimeType;
    }

    let recorder;

    try {
      recorder = new MediaRecorder(
        recordingStream,
        options
      );
    } catch (error) {
      stopCropDrawing();
      console.error("MediaRecorder initialization failed:", error);
      alert("녹화를 시작하지 못했습니다.");
      return;
    }

    recorderRef.current = recorder;

    setRecordingMetadata((prev) => ({
      ...(prev || {}),
      createdAt: new Date().toISOString(),
      crop: {
        mode: "visible-frame",
        objectFit: "cover",
        objectPosition: "center",
        sourceWidth,
        sourceHeight,
        sourceX,
        sourceY,
        cropWidth,
        cropHeight,
        outputWidth: cropWidth,
        outputHeight: cropHeight,
        displayAspectRatio: frameAspect,
      },
    }));

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      stopCropDrawing();

      const actualMimeType =
        recorder.mimeType ||
        mimeType ||
        "video/webm";

      const blob = new Blob(chunksRef.current, {
        type: actualMimeType,
      });

      if (recordedUrlRef.current) {
        URL.revokeObjectURL(recordedUrlRef.current);
      }

      const url = URL.createObjectURL(blob);

      recordedUrlRef.current = url;

      setRecordedBlob(blob);
      setRecordedUrl(url);

      setRecordingMetadata((prev) => ({
        ...prev,
        finishedAt: new Date().toISOString(),
        mimeType: actualMimeType,
        fileSizeBytes: blob.size,
      }));
    };

    recorder.onerror = (event) => {
      console.error("Recording failed:", event.error || event);
      stopCropDrawing();
      setIsRecording(false);
      alert("녹화 중 오류가 발생했습니다.");
    };

    recorder.start(1000);
    setIsRecording(true);
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

  function retake() {
    if (recordedUrlRef.current) {
      URL.revokeObjectURL(recordedUrlRef.current);
      recordedUrlRef.current = null;
    }

    setRecordedUrl(null);
    setRecordedBlob(null);

    setRecordingMetadata((prev) => ({
      ...prev,
      finishedAt: null,
      fileSizeBytes: null,
    }));

    chunksRef.current = [];

    if (previewRef.current) {
      previewRef.current.pause();
      previewRef.current.removeAttribute("src");
      previewRef.current.load();
    }

    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }

  function stopRecording() {
    if (
      recorderRef.current &&
      recorderRef.current.state !== "inactive"
    ) {
      recorderRef.current.stop();
    }

    setIsRecording(false);
  }


  async function submitVideo() {
    if (!recordedBlob || isSubmitting) {
      if (!recordedBlob) {
        alert("녹화된 영상이 없습니다.");
      }
      return;
    }

    setIsSubmitting(true);

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

      const metadata = {
        ...(recordingMetadata || {}),

        participantId,

        task: {
          id: task.id,
          title: task.title,
        },

        item: {
          id: item.id,
          type: item.type,
          prompt: item.prompt ?? null,
          imageSrc: item.imageSrc ?? null,
        },
      };

      formData.append(
        "metadata",
        JSON.stringify(metadata)
      );

      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL;

      const response = await fetch(
        `${API_BASE_URL}/api/recordings`,
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

      onComplete();

    } catch (error) {
      console.error(error);
      alert("업로드에 실패했습니다. 다시 시도해 주세요.");
      setIsSubmitting(false);
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
        <div className="instruction-topbar">
          <button
            type="button"
            className="back-button"
            onClick={onBack}
            disabled={isSubmitting}
          >
            ← 처음으로
          </button>

          <div className="status-row">
            <span className="status-badge">
              {isSubmitting
                ? "파일 전송 중"
                : isRecording
                  ? "녹음 중"
                  : recordedUrl
                    ? "미리보기"
                    : "대기 중"}
            </span>

            {isRecording && (
              <span className="recording-dot">● REC</span>
            )}
          </div>
        </div>

        <div className="stimulus-container">
          <p className="task-instruction">
            {task.instruction}
          </p>

          {item.type === "text" && (
            <div className="stimulus-text">
              {item.prompt}
            </div>
          )}

          {item.type === "image" && (
            <img
              src={item.imageSrc}
              alt="설명할 그림"
              className="stimulus-image"
            />
          )}

          {item.type === "topic" && (
            <div className="stimulus-topic">
              {item.prompt}
            </div>
          )}
        </div>
      </section>

      <section className="camera-panel">
        <div ref={captureAreaRef} className="video-wrapper">

          {isRecording && (
            <div className="recording-overlay">
              <span className="recording-overlay-dot">●</span> 녹음 중
            </div>
          )}

          {isSubmitting && (
            <div className="upload-overlay">
              파일 전송 중…
            </div>
          )}

          {/* 실제 저장용 crop canvas — 화면에는 표시하지 않음 */}
          <canvas
            ref={recordCanvasRef}
            className="record-canvas"
            aria-hidden="true"
          />

          {/* LIVE CAMERA */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="camera-video camera-video-live"
            style={{
              display: recordedUrl ? "none" : "block",
            }}
          />

          {/* GUIDE */}
          {!recordedUrl && (
            <div className="guide-overlay">
              <img
                src={faceShoulderGuide}
                className="guide-image"
                alt=""
              />
              <p className="guide-text">
                얼굴과 어깨를 가이드에 맞춰 주세요
              </p>
            </div>
          )}

          {/* RECORDED PREVIEW */}
          <video
            ref={previewRef}
            src={recordedUrl || undefined}
            controls
            playsInline
            preload="auto"
            className="camera-video"
            style={{
              display: recordedUrl ? "block" : "none",
            }}
          />

        </div>



        <div className="button-bar">
          {!isCameraReady ? (
            <button
              className="primary-button"
              onClick={startCamera}
            >
              카메라 켜기
            </button>
          ) : recordedUrl ? (
            <>
              <button
                onClick={retake}
                disabled={isSubmitting}
              >
                다시 촬영
              </button>

              <button
                className="primary-button"
                onClick={submitVideo}
                disabled={isSubmitting}
              >
                {isSubmitting ? "파일 전송 중…" : "제출하기"}
              </button>
            </>
          ) : isRecording ? (
            <button
              className="primary-button"
              onClick={stopRecording}
            >
              촬영 종료
            </button>
          ) : (
            <button
              className="primary-button"
              onClick={startRecording}
            >
              촬영 시작
            </button>
          )}
        </div>


      </section>
    </main>
  );
}