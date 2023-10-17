function square(n) {
  return n * n;
}

function greet(name: number): string {
  return "Hello, " + name;
}

// Missing return type annotation. This should raise an issue.
function add(a: number, b: number) {
  return a + b;
}

const user = {
  id: 123,
  // Missing type annotation for property. This might raise an issue.
  name: "John"
};

// Using a string where a number is expected. This should raise an issue.
const anotherUser: { id: number, name: string } = {
  id: "456",
  name: "Doe"
};

// Using a string where a number is expected. This should raise an issue.
const anotherAccount: { id: number, name: string } = {
  id: "454241246",
  name: "Foobar"
};
