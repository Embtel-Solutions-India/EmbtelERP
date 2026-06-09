import http from 'http';

function postJson(url: string, data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const postData = JSON.stringify(data);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error("Failed to parse response JSON: " + body));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function getAuthJson(url: string, token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error("Failed to parse response JSON: " + body));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  try {
    console.log("Logging in as superadmin@demo.com...");
    const loginRes = await postJson('http://localhost:4000/auth/login', {
      email: 'superadmin@demo.com',
      password: 'Password@123'
    });
    console.log("Login success! Token retrieved.");
    const token = loginRes.accessToken;

    console.log("First layout fetch for super_admin...");
    let start = Date.now();
    let layoutRes = await getAuthJson('http://localhost:4000/dashboard/layout/super_admin', token);
    console.log(`First fetch took ${Date.now() - start}ms`);

    console.log("Second layout fetch for super_admin...");
    start = Date.now();
    layoutRes = await getAuthJson('http://localhost:4000/dashboard/layout/super_admin', token);
    console.log(`Second fetch took ${Date.now() - start}ms`);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

main();
