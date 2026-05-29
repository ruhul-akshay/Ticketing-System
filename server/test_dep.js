async function fetchDeps() {
  try {
    const res = await fetch('http://localhost:5000/api/departments');
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e);
  }
}
fetchDeps();
