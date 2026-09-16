#include <iostream>
using namespace std;

int main() {
    int n;
    cout << "Digite um numero: ";
    cin >> n;

    int a = 0, b = 1;
    cout << "Sequencia Fibonacci: ";
    while (a <= n) {
        cout << a << " ";
        int prox = a + b;
        a = b;
        b = prox;
    }
    cout << endl;
    return 0;
}
