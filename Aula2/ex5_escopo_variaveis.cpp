#include <iostream>
using namespace std;

int contador = 100;

int main() {
    int contador = 10;

    cout << "Contador global: " << ::contador << endl;
    cout << "Contador local (main): " << contador << endl;

    if (true) {
        int contador = 1;
        cout << "Contador do bloco if: " << contador << endl;
    }

    return 0;
}
