// @flow

// Missing type for the parameter. This should raise an issue.
function square(n) {
  return n * n;
}

// Incorrect type (should be string). This should raise an issue.
function greet(name: number): string {
  return "Hello, " + name;
}

// Unused type alias. This should raise an issue.
type MyObject = {
  id: number,
  name: string
};

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
