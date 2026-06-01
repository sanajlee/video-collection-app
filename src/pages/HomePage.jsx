export default function HomePage({ onStart }) {
  return (
    <main className="home-page">
      <section className="home-card">
        <h1 className="home-title">영상 촬영 과제</h1>

        <p className="home-text">
          안내에 따라 짧은 영상을 촬영해 주세요. 촬영된 영상은 제출 버튼을
          누른 뒤 서버에 업로드됩니다.
        </p>

        <div className="notice-box">
          <p>촬영 전 확인해 주세요.</p>
          <ul>
            <li>카메라와 마이크 권한을 허용해 주세요.</li>
            <li>얼굴이 화면 중앙에 오도록 맞춰 주세요.</li>
            <li>밝은 곳에서 촬영해 주세요.</li>
            <li>촬영 중에는 페이지를 닫지 말아 주세요.</li>
          </ul>
        </div>

        <button className="primary-button" onClick={onStart}>
          시작하기
        </button>
      </section>
    </main>
  );
}