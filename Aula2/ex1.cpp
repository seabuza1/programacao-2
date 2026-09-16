#include <iostream>
using namespace std;

int main() {
    char letra = 'A';
    int idade = 20;
    float altura = 1.75f;
    double peso = 68.5;
    bool ativo = true;
    short pequeno = 100;
    long grande = 100000L;
    unsigned int positivo = 50;

    cout << "char: " << letra << " | tamanho: " << sizeof(letra) << " bytes" << endl;
    cout << "int: " << idade << " | tamanho: " << sizeof(idade) << " bytes" << endl;
    cout << "float: " << altura << " | tamanho: " << sizeof(altura) << " bytes" << endl;
    cout << "double: " << peso << " | tamanho: " << sizeof(peso) << " bytes" << endl;
    cout << "bool: " << ativo << " | tamanho: " << sizeof(ativo) << " bytes" << endl;
    cout << "short: " << pequeno << " | tamanho: " << sizeof(pequeno) << " bytes" << endl;
    cout << "long: " << grande << " | tamanho: " << sizeof(grande) << " bytes" << endl;
    cout << "unsigned int: " << positivo << " | tamanho: " << sizeof(positivo) << " bytes" << endl;

    return 0;
}
