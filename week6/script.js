let a = 20;
let b = 10;

function whatIsMyGrade(marks) {
  if (marks > 80) {
    console.log("you got HD");
  } else if (marks < 40) {
    console.log("sorry you failed");
  } else {
    console.log("you passed");
  }
}

function add(val1, val2) {
  let total = val1 + val2;
  //   console.log(total);
  return total;
}

function subtract(val1, val2) {
  let res = val1 + val2;
  //   console.log(res);
  return res;
}

// let c = a + b;
let c = add(a, b);
console.log(c);
// console. log(total);

c = subtract(a, b);
console.log(c);

c = subtract(140, 56);
console.log(c);

c = 40 + 56;
console.log(c);

a = 45;
b = 6;
c = a + b;
console.log(c);
