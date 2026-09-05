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

export default function RecordPage({
  onBack,
  participantId,
  task,
  item,
  taskIndex,
  itemIndex,
  totalTasks,
  onComplete,
}) {
  const videoRef = useRef(null);
  const previewRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const recordedUrlRef = useRef(null);

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState(null);

  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingMetadata, setRecordingMetadata] = useState(null);
  const [mimeType, setMimeType] = useState("");

  useEffect(() => {
    return () => {
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


  function startRecording() {
    if (!streamRef.current) {
      alert("카메라가 준비되지 않았습니다.");
      return;
    }

    chunksRef.current = [];

    if (recordedUrlRef.current) {
      URL.revokeObjectURL(recordedUrlRef.current);
      recordedUrlRef.current = null;
    }

    setRecordedUrl(null);
    setRecordedBlob(null);

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
      if (event.data && event.data.size > 0) {
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

    recorder.start();
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

      onComplete();

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
          <p>
            STEP {taskIndex + 1} / {totalTasks}
          </p>

          <h2>{task.title}</h2>

          <p>{task.instruction}</p>

          <p>
            {itemIndex + 1} / {task.items.length}
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

        <div className="status-row">
          <span className="status-badge">
            {isRecording ? "촬영 중" : recordedUrl ? "미리보기" : "대기 중"}
          </span>

          {isRecording && <span className="recording-dot">● REC</span>}
        </div>
      </section>

      <section className="camera-panel">
        <div className="video-wrapper">

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
              <button onClick={retake}>
                다시 촬영
              </button>

              <button
                className="primary-button"
                onClick={submitVideo}
              >
                제출하기
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