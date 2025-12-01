// src/app/terms/page.tsx

export default function TermsPage() {
  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "20px",
        lineHeight: "1.6",
        color: "#333",
      }}
    >
      <h1
        style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}
      >
        利用規約
      </h1>

      <p style={{ marginBottom: "20px", fontSize: "14px", color: "#666" }}>
        この利用規約（以下「本規約」）は、当アプリの利用条件を定めるものです。登録ユーザーの皆様には、本規約に従ってサービスをご利用いただきます。
      </p>

      <section style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            borderBottom: "1px solid #ddd",
            paddingBottom: "4px",
            marginBottom: "10px",
          }}
        >
          第1条（禁止事項）
        </h2>
        <p>
          ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
        </p>
        <ul
          style={{
            listStyle: "decimal",
            paddingLeft: "20px",
            marginTop: "10px",
          }}
        >
          <li>法令または公序良俗に違反する行為</li>
          <li>犯罪行為に関連する行為（売春、薬物取引、詐欺等を含む）</li>
          <li>
            当アプリのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為
          </li>
          <li>他のユーザーに成りすます行為</li>
          <li>
            当アプリのサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            borderBottom: "1px solid #ddd",
            paddingBottom: "4px",
            marginBottom: "10px",
          }}
        >
          第2条（利用制限および登録抹消）
        </h2>
        <p>
          運営者は、ユーザーが本規約のいずれかの条項に違反した場合、事前の通知なく、ユーザーに対して本サービスの全部もしくは一部の利用を制限し、またはユーザーとしての登録を抹消することができるものとします。
          <br />
          また、通報があった場合や法令違反の疑いがある場合、運営者は当該メッセージや画像を確認し、必要に応じて削除する権利を有します。
        </p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            borderBottom: "1px solid #ddd",
            paddingBottom: "4px",
            marginBottom: "10px",
          }}
        >
          第3条（免責事項）
        </h2>
        <p>
          運営者は、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。
        </p>
      </section>

      <div style={{ marginTop: "30px", textAlign: "center" }}>
        <a
          href="/profile"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            backgroundColor: "#f0f0f0",
            borderRadius: "20px",
            textDecoration: "none",
            color: "#333",
          }}
        >
          戻る
        </a>
      </div>
    </div>
  );
}
