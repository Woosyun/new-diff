#include<stdio.h>

int Minus(int a, int b){
  return a - b;
}

int Add(int a, int b) {
  return a + b;
}

int main(void){
  int a = 10;
  int b = 20;
  int c = Add(a, b);
  int d = Minus(a, b);
  printf("c = %d\n", c);
  printf("d = %d\n", d);
  return 0;
}