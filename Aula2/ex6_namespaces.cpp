#include <iostream>
using namespace std;

namespace Geometria {
    namespace Retangulo {
        double calcularArea(double b, double h) {
            return b * h;
        }
    }

    namespace Circulo {
        const double PI = 3.14159;
        double calcularArea(double r) {
            return PI * r * r;
        }
    }
}

int main() {
    // 1. Nome totalmente qualificado
    cout << "Area retangulo: " << Geometria::Retangulo::calcularArea(4.0, 5.0) << endl;

    // 2. Declaracao using especifica
    using Geometria::Circulo::calcularArea;
    cout << "Area circulo: " << calcularArea(3.0) << endl;

    // 3. Diretiva using namespace
    using namespace Geometria::Retangulo;
    cout << "Area retangulo de novo: " << calcularArea(2.0, 6.0) << endl;

    return 0;
}
