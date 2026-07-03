require("dotenv").config();

const baseUrl = `http://localhost:${process.env.PORT || 8002}/api`;
const suffix = Date.now();

const userA = `buddytestA${suffix}`;
const userB = `buddytestB${suffix}`;
const userC = `buddytestC${suffix}`;
const password = "Test1234!";

async function register(name) {
  const res = await fetch(`${baseUrl}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: name,
      password,
      confirmPassword: password,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data.token;
}

async function requestBuddy(token, targetUserName) {
  const res = await fetch(`${baseUrl}/buddy/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ targetUserName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function getUserInfo(token) {
  const res = await fetch(`${baseUrl}/user/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data.buddy;
}

async function run() {
  console.log("Registering test users...");
  const tokenA = await register(userA);
  const tokenB = await register(userB);
  const tokenC = await register(userC);

  console.log("A requests B...");
  await requestBuddy(tokenA, userB);
  let buddyA = await getUserInfo(tokenA);
  let buddyB = await getUserInfo(tokenB);
  console.log("A:", buddyA);
  console.log("B:", buddyB);
  if (buddyA.status !== "PENDING" || buddyA.buddyName !== userB) {
    throw new Error("Scenario 1 failed: A should be PENDING to B");
  }
  if (buddyB.status !== "NONE") {
    throw new Error("Scenario 1 failed: B should be NONE");
  }

  console.log("B requests C (A still pending to B)...");
  await requestBuddy(tokenB, userC);
  buddyA = await getUserInfo(tokenA);
  buddyB = await getUserInfo(tokenB);
  let buddyC = await getUserInfo(tokenC);
  console.log("A:", buddyA);
  console.log("B:", buddyB);
  console.log("C:", buddyC);
  if (buddyA.status !== "PENDING" || buddyA.buddyName !== userB) {
    throw new Error("Scenario 2 failed: A should still be PENDING to B");
  }
  if (buddyB.status !== "PENDING" || buddyB.buddyName !== userC) {
    throw new Error("Scenario 2 failed: B should be PENDING to C");
  }
  if (buddyC.status !== "NONE") {
    throw new Error("Scenario 2 failed: C should be NONE");
  }

  console.log("Register fresh pair for mutual match...");
  const userD = `buddytestD${suffix}`;
  const userE = `buddytestE${suffix}`;
  const tokenD = await register(userD);
  const tokenE = await register(userE);

  await requestBuddy(tokenD, userE);
  await requestBuddy(tokenE, userD);
  let buddyD = await getUserInfo(tokenD);
  let buddyE = await getUserInfo(tokenE);
  console.log("D:", buddyD);
  console.log("E:", buddyE);
  if (buddyD.status !== "BUDDY" || buddyD.buddyName !== userE) {
    throw new Error("Scenario 3 failed: D should be BUDDY with E");
  }
  if (buddyE.status !== "BUDDY" || buddyE.buddyName !== userD) {
    throw new Error("Scenario 3 failed: E should be BUDDY with D");
  }

  console.log("D (buddy with E) requests C...");
  await requestBuddy(tokenD, userC);
  buddyD = await getUserInfo(tokenD);
  buddyE = await getUserInfo(tokenE);
  buddyC = await getUserInfo(tokenC);
  console.log("D:", buddyD);
  console.log("E:", buddyE);
  console.log("C:", buddyC);
  if (buddyD.status !== "PENDING" || buddyD.buddyName !== userC) {
    throw new Error("Scenario 4 failed: D should be PENDING to C");
  }
  if (buddyE.status !== "NONE") {
    throw new Error("Scenario 4 failed: E should be NONE after break");
  }

  console.log("All buddy flow tests passed.");
}

run().catch((err) => {
  console.error("Test failed:", err.message);
  process.exit(1);
});
