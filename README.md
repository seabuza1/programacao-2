# 💻 Exercícios em C++ — Universidade Federal do Mato Grosso (UFMT)

Repositório criado para armazenar e organizar os exercícios desenvolvidos na disciplina de Programação do curso de Ciência da Computação da Universidade Federal do Mato Grosso (UFMT).

## 🎯 Objetivo

Este repositório tem como finalidade:

* Praticar e aprimorar os conhecimentos em lógica de programação e linguagem C++.
* Servir como base de estudo para outros alunos e interessados.
* Registrar o progresso durante a graduação em Ciência da Computação.

## 🧩 Estrutura do Repositório

Os exercícios estão organizados por aula:

| Pasta | Conteúdo |
|---|---|
| [`Aula1/`](./Aula1) | Saída de texto com `cout`, leitura de variáveis com `cin` e operações aritméticas básicas (dobro, triplo, soma, diferença, multiplicação) |
| [`Aula2/`](./Aula2) | Tipos primitivos e `sizeof`, conversão de temperatura com `static_cast`, `#define` vs `const`, leitura com `getline`, escopo de variáveis, namespaces aninhados e conversões com `stoi`/`boolalpha` |
| [`Aula3/`](./Aula3) | Estruturas condicionais e laços: ano de Copa, sequência de Fibonacci, faixa etária, reajuste salarial e cálculo de fatorial |

## ⚙️ Como compilar e executar

Cada exercício é um programa independente. Para compilar qualquer um deles:

```bash
g++ -std=c++17 -Wall -Wextra -o programa caminho/do/arquivo.cpp
./programa
```

Exemplo:

```bash
g++ -std=c++17 -Wall -Wextra -o fibonacci Aula3/ex2_fibonacci.cpp
./fibonacci
```

## 📋 Requisitos

* Compilador com suporte a C++17 (g++ 7+, clang 5+ ou MSVC 2017+)
