const password = "ramaGanteng"; 
const hash = Bun.password.hash(password);
console.log("Password Hash:", hash);