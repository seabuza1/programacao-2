#include <iostream>
using namespace std;

int main() {
    double salario;
    cout << "Digite o salario: ";
    cin >> salario;

    double novoSalario;
    if (salario < 3000.0) {
        novoSalario = salario * 1.5;
    } else if (salario <= 10000.0) {
        novoSalario = salario * 1.2;
    } else {
        novoSalario = salario * 1.15;
    }

    cout << "Novo salario: " << novoSalario << endl;
    return 0;
}
