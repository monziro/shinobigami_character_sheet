"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export default function CharactersPage() {
  const [characters, setCharacters] = useState([]);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const q = query(collection(db, "characters"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const charList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCharacters(charList);
      } catch (error) {
        console.error("キャラクター取得エラー:", error);
      }
    };

    fetchCharacters();
  }, []);

  return (
    <div style={{ maxWidth: "800px", margin: "auto" }}>
      <h2>キャラクター一覧</h2>
      {characters.length === 0 ? (
        <p>キャラクターがまだ登録されていません。</p>
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
              {/* 詳細ページへのリンクボタン */}
                <a href={`/characters/view/${char.id}`}>
                    <button style={{ marginTop: "10px" }}>詳細へ</button>
                </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
