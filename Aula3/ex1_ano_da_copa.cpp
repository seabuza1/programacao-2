#include <iostream>
using namespace std;

int main() {
    int ano;
    cout << "Digite um ano: ";
    cin >> ano;

    if (ano % 4 == 0) {
        cout << "Este ano tem copa!" << endl;
    } else {
        cout << "Este ano nao tem copa." << endl;
    }
    return 0;
}
