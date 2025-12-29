"use client";

import { useState } from "react";
import { auth } from "../../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMessage("ログイン成功！");
      // ログイン成功後に my-characters ページへ移動
      router.push("/my-characters");
    } catch (error) {
      setMessage("ログイン失敗: " + error.message);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto" }}>
      <h2>ログイン</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        /><br />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        /><br />
        <button type="submit">ログイン</button>
      </form>
      <p>{message}</p>

      {/* my-characters ページへ移動するボタン */}
      <button
        style={{ marginTop: "20px" }}
        onClick={() => router.push("/my-characters")}
      >
        マイキャラクターへ
      </button>
    </div>
  );
}
