function HomePage({ participantId, onStart }) {
  return (
    <main className="home-page">
      <h1>Video Collection Pilot</h1>

      <p>
        화면의 안내에 따라 세 가지 말하기 과제를 진행합니다.
      </p>

      <p>
        참가자 코드: <strong>{participantId}</strong>
      </p>

      <button onClick={onStart}>
        시작하기
      </button>
    </main>
  );
}

export default HomePage;