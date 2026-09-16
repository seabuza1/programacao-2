#include <iostream>
using namespace std;

int main() {
    double celsius;
    cout << "Digite a temperatura em Celsius: ";
    cin >> celsius;

    double fahrenheit = celsius * 1.8 + 32;
    double kelvin = celsius + 273.15;

    cout << "Fahrenheit: " << fahrenheit << endl;
    cout << "Kelvin: " << kelvin << endl;

    int fahrenheitInt = static_cast<int>(fahrenheit);
    cout << "Fahrenheit (inteiro): " << fahrenheitInt << endl;

    return 0;
}
