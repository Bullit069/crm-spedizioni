import { useEffect, useState } from "react";
import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import Login from "./Login"; // <-- importa il nuovo componente Login

export default function App() {
  const [spedizioni, setSpedizioni] = useState([]);
  const [merceArrivata, setMerceArrivata] = useState([]);
  const [nuovaSpedizione, setNuovaSpedizione] = useState({ cliente: "", prodotto: "", quantita: 1 });
  const [nuovaMerce, setNuovaMerce] = useState({ prodotto: "", quantita: 0 });
  const [utente, setUtente] = useState(null);

  const UID_ADMIN = "OvttVN20YZgmHIzMQtFKHzJtWNB2";

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUtente(user);
      else setUtente(null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!utente) return;

    const storedSpedizioni = JSON.parse(localStorage.getItem("spedizioni")) || [];
    const storedMerce = JSON.parse(localStorage.getItem("merceArrivata")) || [];
    setSpedizioni(storedSpedizioni);
    setMerceArrivata(storedMerce);

    const fetchData = async () => {
      try {
        const docSpedizioni = await getDoc(doc(db, "dati", "spedizioni"));
        const docMerce = await getDoc(doc(db, "dati", "merceArrivata"));

        if (docSpedizioni.exists()) setSpedizioni(docSpedizioni.data().records);
        if (docMerce.exists()) setMerceArrivata(docMerce.data().records);
      } catch (error) {
        console.error("Errore nel recupero da Firebase:", error);
      }
    };

    fetchData();
  }, [utente]);

  const salvaDati = async () => {
    try {
      localStorage.setItem("spedizioni", JSON.stringify(spedizioni));
      localStorage.setItem("merceArrivata", JSON.stringify(merceArrivata));

      await setDoc(doc(db, "dati", "spedizioni"), { records: spedizioni });
      await setDoc(doc(db, "dati", "merceArrivata"), { records: merceArrivata });

      alert("✅ Dati salvati in locale e su Firebase!");
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
      alert("❌ Errore nel salvataggio su Firebase");
    }
  };

  const logout = () => {
    const auth = getAuth();
    signOut(auth);
  };

  const aggiungiSpedizione = () => {
    const prodottoSpedito = nuovaSpedizione.prodotto.trim().toLowerCase();
    const copiaMerce = [...merceArrivata];
    const index = copiaMerce.findIndex(m => m.prodotto.toLowerCase() === prodottoSpedito);

    if (index !== -1 && copiaMerce[index].quantita >= nuovaSpedizione.quantita) {
      copiaMerce[index].quantita -= nuovaSpedizione.quantita;
      setMerceArrivata(copiaMerce);
      setSpedizioni([...spedizioni, nuovaSpedizione]);
      setNuovaSpedizione({ cliente: "", prodotto: "", quantita: 1 });
    } else {
      alert("⚠️ Prodotto non disponibile o quantità insufficiente!");
    }
  };

  const aggiungiMerce = () => {
    const prodotto = nuovaMerce.prodotto.trim().toLowerCase();
    if (!prodotto) return;

    const copia = [...merceArrivata];
    const index = copia.findIndex(m => m.prodotto.toLowerCase() === prodotto);
    if (index !== -1) {
      copia[index].quantita += Number(nuovaMerce.quantita);
    } else {
      copia.push({ ...nuovaMerce });
    }

    setMerceArrivata(copia);
    setNuovaMerce({ prodotto: "", quantita: 0 });
  };

  const modificaRiga = (tipo, index, campo, valore) => {
    const setter = tipo === "spedizioni" ? setSpedizioni : setMerceArrivata;
    const array = tipo === "spedizioni" ? [...spedizioni] : [...merceArrivata];
    array[index][campo] = campo === "quantita" ? Number(valore) : valore;
    setter(array);
  };

  const eliminaRiga = (tipo, index) => {
    const setter = tipo === "spedizioni" ? setSpedizioni : setMerceArrivata;
    const array = tipo === "spedizioni" ? [...spedizioni] : [...merceArrivata];
    array.splice(index, 1);
    setter(array);
  };

  if (!utente) return <Login onLogin={setUtente} />;

  return (
    <div style={{ padding: "20px" }}>
      <h1>📦 CRM Cloud – Spedizioni e Merce</h1>
      <p>👤 Utente: {utente.email || "anonimo"} {utente.uid === UID_ADMIN && "(Admin)"}</p>
      <button onClick={logout} style={{ float: "right" }}>🚪 Logout</button>

      {utente.uid === UID_ADMIN && (
        <button onClick={salvaDati} style={{ backgroundColor: "green", color: "white", padding: "10px", marginBottom: "20px" }}>
          💾 Salva
        </button>
      )}

      <h2>➕ Aggiungi Spedizione</h2>
      <input type="text" placeholder="Cliente" value={nuovaSpedizione.cliente} onChange={(e) => setNuovaSpedizione({ ...nuovaSpedizione, cliente: e.target.value })} />
      <input type="text" placeholder="Prodotto" value={nuovaSpedizione.prodotto} onChange={(e) => setNuovaSpedizione({ ...nuovaSpedizione, prodotto: e.target.value })} />
      <input type="number" min="1" value={nuovaSpedizione.quantita} onChange={(e) => setNuovaSpedizione({ ...nuovaSpedizione, quantita: Number(e.target.value) })} />
      <button onClick={aggiungiSpedizione}>➕ Aggiungi</button>

      <h3>📤 Spedizioni</h3>
      <table border="1" width="100%" style={{ marginBottom: "40px" }}>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Prodotto</th>
            <th>Quantità</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {spedizioni.map((s, i) => (
            <tr key={i}>
              <td><input value={s.cliente} onChange={(e) => modificaRiga("spedizioni", i, "cliente", e.target.value)} /></td>
              <td><input value={s.prodotto} onChange={(e) => modificaRiga("spedizioni", i, "prodotto", e.target.value)} /></td>
              <td><input type="number" value={s.quantita} onChange={(e) => modificaRiga("spedizioni", i, "quantita", e.target.value)} /></td>
              <td><button onClick={() => eliminaRiga("spedizioni", i)} style={{ backgroundColor: "red", color: "white" }}>🗑️</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>📦 Aggiungi Merce Arrivata</h2>
      <input type="text" placeholder="Prodotto" value={nuovaMerce.prodotto} onChange={(e) => setNuovaMerce({ ...nuovaMerce, prodotto: e.target.value })} />
      <input type="number" min="1" placeholder="Quantità" value={nuovaMerce.quantita} onChange={(e) => setNuovaMerce({ ...nuovaMerce, quantita: Number(e.target.value) })} />
      <button onClick={aggiungiMerce}>➕ Aggiungi</button>

      <h3>📥 Merce Arrivata</h3>
      <table border="1" width="100%">
        <thead>
          <tr>
            <th>Prodotto</th>
            <th>Quantità</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {merceArrivata.map((m, i) => (
            <tr key={i}>
              <td><input value={m.prodotto} onChange={(e) => modificaRiga("merceArrivata", i, "prodotto", e.target.value)} /></td>
              <td><input type="number" value={m.quantita} onChange={(e) => modificaRiga("merceArrivata", i, "quantita", e.target.value)} /></td>
              <td><button onClick={() => eliminaRiga("merceArrivata", i)} style={{ backgroundColor: "red", color: "white" }}>🗑️</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
