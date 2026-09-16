#include <iostream>
#include <string>
using namespace std;

int main() {
    string nome;
    int idade;
    float nota;

    cout << "Digite o nome completo: ";
    getline(cin, nome);

    cout << "Digite a idade: ";
    cin >> idade;

    cout << "Digite a nota final: ";
    cin >> nota;

    string notaTexto = to_string(nota);

    cout << "Aluno " << nome << ", " << idade << " anos, nota: " << notaTexto << endl;

    return 0;
}
