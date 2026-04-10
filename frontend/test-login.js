const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function testLogin() {
    try {
        console.log(`Testing login against ${apiUrl}/api/auth/login`);
        const res = await fetch(`${apiUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "test4@test.com", password: "password" }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Login failed with response:", res.status, errorText);
            throw new Error(errorText || "Invalid credentials");
        }

        const data = await res.json();
        console.log("Login successful! Token received:", data.token ? "yes" : "no");
    } catch (e) {
        console.error("Fetch threw error:", e);
    }
}

testLogin();
