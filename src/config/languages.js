/**
 * Single source of truth for every language the playground supports.
 *
 * The keys are stored inside saved workspaces, so existing ones must never be
 * renamed — `cpp`, `java`, `javascript` and `python` predate this file.
 *
 *   label    - shown in the dropdowns
 *   judge0Id - execution id, see https://ce.judge0.com/languages
 *   monaco   - Monaco's language id, for syntax highlighting
 *   extension- used when exporting the file
 *   starter  - boilerplate inserted into a new file
 */
export const LANGUAGES = {
    c: {
        label: 'C',
        judge0Id: 50,
        monaco: 'c',
        extension: 'c',
        starter: `#include <stdio.h>

int main(void) {
    printf("Hello World!\\n");
    return 0;
}
`
    },

    cpp: {
        label: 'C++',
        judge0Id: 54,
        monaco: 'cpp',
        extension: 'cpp',
        starter: `#include <bits/stdc++.h>
using namespace std;

int main() {
    cout << "Hello World!";
    return 0;
}
`
    },

    csharp: {
        label: 'C#',
        judge0Id: 51,
        monaco: 'csharp',
        extension: 'cs',
        starter: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello World!");
    }
}
`
    },

    go: {
        label: 'Go',
        judge0Id: 60,
        monaco: 'go',
        extension: 'go',
        starter: `package main

import "fmt"

func main() {
    fmt.Println("Hello World!")
}
`
    },

    java: {
        label: 'Java',
        judge0Id: 62,
        monaco: 'java',
        extension: 'java',
        starter: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World!");
    }
}
`
    },

    javascript: {
        label: 'JavaScript',
        judge0Id: 63,
        monaco: 'javascript',
        extension: 'js',
        starter: `console.log("Hello World!");`
    },

    kotlin: {
        label: 'Kotlin',
        judge0Id: 78,
        monaco: 'kotlin',
        extension: 'kt',
        starter: `fun main() {
    println("Hello World!")
}
`
    },

    lua: {
        label: 'Lua',
        judge0Id: 64,
        monaco: 'lua',
        extension: 'lua',
        starter: `print("Hello World!")`
    },

    php: {
        label: 'PHP',
        judge0Id: 68,
        monaco: 'php',
        extension: 'php',
        starter: `<?php

echo "Hello World!\\n";
`
    },

    python: {
        label: 'Python',
        judge0Id: 71,
        monaco: 'python',
        extension: 'py',
        starter: `print("Hello World!")`
    },

    ruby: {
        label: 'Ruby',
        judge0Id: 72,
        monaco: 'ruby',
        extension: 'rb',
        starter: `puts "Hello World!"`
    },

    rust: {
        label: 'Rust',
        judge0Id: 73,
        monaco: 'rust',
        extension: 'rs',
        starter: `fn main() {
    println!("Hello World!");
}
`
    },

    scala: {
        label: 'Scala',
        judge0Id: 81,
        monaco: 'scala',
        extension: 'scala',
        starter: `object Main extends App {
  println("Hello World!")
}
`
    },

    shell: {
        label: 'Bash',
        judge0Id: 46,
        monaco: 'shell',
        extension: 'sh',
        starter: `echo "Hello World!"`
    },

    swift: {
        label: 'Swift',
        judge0Id: 83,
        monaco: 'swift',
        extension: 'swift',
        starter: `print("Hello World!")`
    },

    typescript: {
        label: 'TypeScript',
        judge0Id: 74,
        monaco: 'typescript',
        extension: 'ts',
        starter: `const greeting: string = "Hello World!";
console.log(greeting);
`
    }
};

export const supportedLanguages = Object.keys(LANGUAGES);

// Alphabetical by label so the dropdowns stay predictable as languages are added.
export const languageOptions = supportedLanguages
    .map(value => ({ value, label: LANGUAGES[value].label }))
    .sort((a, b) => a.label.localeCompare(b.label));

export const DEFAULT_LANGUAGE = 'cpp';

export const starterCode = (language) => LANGUAGES[language]?.starter ?? '';

export const extensionFor = (language) => LANGUAGES[language]?.extension ?? 'txt';

export const judge0IdFor = (language) => LANGUAGES[language]?.judge0Id;

// Falls back to plaintext so an unknown language still opens in the editor
// instead of leaving Monaco in an undefined state.
export const monacoIdFor = (language) => LANGUAGES[language]?.monaco ?? 'plaintext';
