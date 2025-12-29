"use client";

import { useState } from "react";
import { auth, db, storage } from "../../firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function NewCharacterPage() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [hp, setHp] = useState("");
  const [mp, setMp] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState("");

  // ログイン状態を監視
  onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setMessage("ログインしてください");
      return;
    }

    try {
      let imageUrl = null;

      // 画像が選択されていればStorageにアップロード
      if (imageFile) {
        const imageRef = ref(storage, `characters/${user.uid}/${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      // Firestoreにキャラクター情報を保存
      await addDoc(collection(db, "characters"), {
        name: name,
        stats: { HP: hp, MP: mp },
        ownerId: user.uid,
        imageUrl: imageUrl,
        createdAt: serverTimestamp() // ← 修正ポイント
      });

      setMessage("キャラクターを登録しました！");
      setName("");
      setHp("");
      setMp("");
      setImageFile(null);
    } catch (error) {
      setMessage("エラー: " + error.message);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto" }}>
      <h2>キャラクター新規作成</h2>
      {user ? (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="キャラクター名"
            value={name}
            onChange={(e) => setName(e.target.value)}
          /><br />
          <input
            type="number"
            placeholder="HP"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
          /><br />
          <input
            type="number"
            placeholder="MP"
            value={mp}
            onChange={(e) => setMp(e.target.value)}
          /><br />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
          /><br />
          <button type="submit">登録</button>
        </form>
      ) : (
        <p>ログインしてください → <a href="/login">ログインページへ</a></p>
      )}
      <p>{message}</p>
    </div>
  );
}
