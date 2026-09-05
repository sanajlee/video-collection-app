export default function CompletePage({ participantId }) {
  return (
    <main style={{ padding: "2rem", textAlign: "center" }}>
      <h1>실험이 완료되었습니다.</h1>

      <p>
        참여해주셔서 감사합니다.
      </p>

      <p>
        참가자 코드: <strong>{participantId}</strong>
      </p>
    </main>
  );
}