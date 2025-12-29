"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db, storage } from "../../../firebaseConfig";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function CharacterDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [character, setCharacter] = useState(null);
  const [name, setName] = useState("");
  const [hp, setHp] = useState("");
  const [mp, setMp] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (id) {
        const docRef = doc(db, "characters", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCharacter(data);
          setName(data.name);
          setHp(data.stats?.HP || "");
          setMp(data.stats?.MP || "");
        }
      }
    });
    return () => unsubscribe();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!user || user.uid !== character.ownerId) {
      setMessage("編集権限がありません");
      return;
    }
    try {
      const docRef = doc(db, "characters", id);
      let imageUrl = character.imageUrl;

      if (imageFile) {
        const imageRef = ref(storage, `characters/${user.uid}/${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      await updateDoc(docRef, {
        name: name,
        stats: { HP: hp, MP: mp },
        imageUrl: imageUrl,
      });

      setMessage("キャラクターを更新しました！");
    } catch (error) {
      setMessage("更新エラー: " + error.message);
    }
  };

  const handleDelete = async () => {
    if (!user || user.uid !== character.ownerId) {
      setMessage("削除権限がありません");
      return;
    }
    try {
      const docRef = doc(db, "characters", id);
      await deleteDoc(docRef);
      setMessage("キャラクターを削除しました！");
      router.push("/my-characters");
    } catch (error) {
      setMessage("削除エラー: " + error.message);
    }
  };

  if (!character) {
    return <p>キャラクターを読み込み中...</p>;
  }

  const isOwner = user && character.ownerId === user.uid;

  return (
    <div style={{ maxWidth: "600px", margin: "auto" }}>
      <h2>キャラクター詳細</h2>
      <p>キャラクター名: <strong>{character.name}</strong></p>
      <p>HP: {character.stats?.HP}</p>
      <p>MP: {character.stats?.MP}</p>
      {character.imageUrl && (
        <img
          src={character.imageUrl}
          alt={character.name}
          style={{ width: "100%", height: "auto", marginTop: "20px" }}
        />
      )}

      <p>キャラクター所有者ID: <strong>{character.ownerId}</strong></p>
      <p>現在ログイン中のユーザーID: <strong>{user?.uid}</strong></p>

      {isOwner ? (
        <>
          <h3>編集</h3>
          <form onSubmit={handleUpdate}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="キャラクター名"
            /><br />
            <input
              type="number"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              placeholder="HP"
            /><br />
            <input
              type="number"
              value={mp}
              onChange={(e) => setMp(e.target.value)}
              placeholder="MP"
            /><br />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
            /><br />
            <button type="submit">更新</button>
          </form>
          <button onClick={handleDelete} style={{ marginTop: "10px", color: "red" }}>
            削除
          </button>
        </>
      ) : (
        <p>このキャラクターは他のユーザーの所有物です。編集・削除はできません。</p>
      )}

      <p>{message}</p>
    </div>
  );
}
