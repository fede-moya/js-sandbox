// @flow

// Using a variable before declaration should trigger an ESLint warning.
const result = square(undeclaredVar);

// Missing type for the parameter
function square(n) {
  // Using == instead of === should trigger an ESLint warning.
  if (n == undefined) {
    return 0;
  }
  return n * n;
}

// Incorrect type (should be string)
function greet(name: number): string {
  // Using var instead of let/const should trigger an ESLint warning.
  var greeting = "Hello, " + name;
  return greeting;
}

// Unused type alias
type MyObject = {
  id: number,
  name: string
};

// Missing return type annotation
function add(a: number, b: number) {
  // Unnecessary semicolon should trigger an ESLint warning.
  return a + b;;
}

// Missing type annotation for property
const user = {
  id: 123,
  // Missing type annotation for property
  name: "John"
};

// Unused variable should trigger an ESLint warning.
const unusedVariable = "I'm unused";
