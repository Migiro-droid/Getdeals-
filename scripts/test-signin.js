import fetch from 'node-fetch';

async function run(){
  const res = await fetch('http://localhost:4000/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'j.ericndivo@gmail.com', password: 'wd_24*jmv' }),
  });
  const json = await res.json();
  console.log('status', res.status);
  console.log(JSON.stringify(json, null, 2));
}

run().catch(e=>{ console.error(e); process.exit(1); });
