#include <iostream>
#define TAXA_JUROS 0.05
using namespace std;

const int ANOS = 3;

int main() {
    double capital;
    cout << "Digite o capital inicial: ";
    cin >> capital;

    double montante = capital * (1 + TAXA_JUROS * ANOS);
    double diferenca = montante - capital;

    cout << "Montante final: " << montante << endl;
    cout << "Diferenca (juros ganhos): " << diferenca << endl;

    return 0;
}
