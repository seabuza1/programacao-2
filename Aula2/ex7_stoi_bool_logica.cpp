#include <iostream>
#include <string>
using namespace std;

int main() {
    string texto;
    cout << "Digite um numero inteiro: ";
    cin >> texto;

    int numero = stoi(texto);
    bool valorBool = numero;

    bool positivo = numero > 0;
    bool par = numero % 2 == 0;

    cout << boolalpha;
    cout << "Convertido para bool: " << valorBool << endl;
    cout << "E positivo: " << positivo << endl;
    cout << "E par: " << par << endl;

    return 0;
}
