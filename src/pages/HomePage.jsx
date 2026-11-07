function HomePage({ participantId, onStart }) {
  return (
    <main className="home-page">
      <div className="home-card">
        <div className="home-header">
          <p className="home-eyebrow">Speech and Video Collection</p>
          <h1>말하기 과제 파일럿</h1>
          <p className="home-subtitle">
            화면의 안내에 따라 세 가지 말하기 과제를 수행합니다.
          </p>
        </div>

        <div className="home-info">
          <div className="participant-badge">
            <span className="participant-label">참가자 코드</span>
            <strong className="participant-id">{participantId}</strong>
          </div>

          <ul className="home-checklist">
            <li>조용한 환경에서 참여해 주세요.</li>
            <li>카메라와 마이크 권한을 허용해 주세요.</li>
            <li>각 과제는 안내 문구를 읽고 바로 시작할 수 있습니다.</li>
          </ul>
        </div>

        <div className="home-actions">
          <button className="start-button" onClick={onStart}>
            시작하기
          </button>
          <p className="home-note">
            녹화된 영상과 음성은 연구 목적으로만 사용됩니다.
          </p>
        </div>
      </div>
    </main>
  );
}

export default HomePage;