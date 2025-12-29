"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../firebaseConfig";
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function MyCharactersPage() {
  const [user, setUser] = useState(null);
  const [characters, setCharacters] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const q = query(
            collection(db, "characters"),
            where("ownerId", "==", currentUser.uid),
            orderBy("createdAt", "desc")
          );
          const querySnapshot = await getDocs(q);
          const charList = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setCharacters(charList);
        } catch (error) {
          console.error("キャラクター取得エラー:", error);
        }
      } else {
        setCharacters([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // 新規作成ボタンの処理
  const handleCreate = async () => {
    if (!user) {
      alert("ログインしてください");
      return;
    }
    try {
      const docRef = await addDoc(collection(db, "characters"), {
        name: "新しいキャラクター",
        stats: { HP: 0, MP: 0 },
        ownerId: user.uid,
        imageUrl: null,
        createdAt: serverTimestamp(),
      });
      // 作成したキャラクターの編集ページへ遷移
      router.push(`/characters/edit/${docRef.id}`);
    } catch (error) {
      console.error("新規作成エラー:", error);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "auto" }}>
      <h2>自分のキャラクター一覧</h2>

      {/* 新規作成ボタン */}
      <button style={{ marginBottom: "20px" }} onClick={handleCreate}>
        新規作成
      </button>

      {user && (
        <p>
          現在ログイン中のユーザーID: <strong>{user.uid}</strong>
        </p>
      )}

      {!user ? (
        <p>ログインしてください → <a href="/login">ログインページへ</a></p>
      ) : characters.length === 0 ? (
        <p>まだキャラクターが登録されていません。</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {characters.map((char) => (
            <div key={char.id} style={{ border: "1px solid #ccc", padding: "10px" }}>
              <h3>{char.name}</h3>
              <p>HP: {char.stats?.HP}</p>
              <p>MP: {char.stats?.MP}</p>
              {char.imageUrl && (
                <img
                  src={char.imageUrl}
                  alt={char.name}
                  style={{ width: "100%", height: "auto", borderRadius: "8px" }}
                />
              )}
              <a href={`/characters/view/${char.id}`}>
                <button style={{ marginTop: "10px" }}>閲覧</button>
              </a>
              <a href={`/characters/edit/${char.id}`}>
                <button style={{ marginTop: "10px" }}>編集</button>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
