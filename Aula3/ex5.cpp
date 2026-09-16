#include <iostream>
using namespace std;

int main() {
    int n;
    cout << "Digite um numero: ";
    cin >> n;

    long long fatorial = 1;
    for (int i = 1; i <= n; i++) {
        fatorial *= i;
    }

    cout << "O fatorial e: " << fatorial << endl;
    return 0;
}
