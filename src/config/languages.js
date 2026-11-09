/**
 * Single source of truth for every language the playground supports.
 *
 * The keys are stored inside saved workspaces, so existing ones must never be
 * renamed — `cpp`, `java`, `javascript` and `python` predate this file.
 *
 *   label    - shown in the dropdowns
 *   short    - 1-3 character badge text shown on file cards and in the tree
 *   color    - badge colour; chosen to stay readable on the dark surfaces
 *   judge0Id - execution id, see https://ce.judge0.com/languages
 *   monaco   - Monaco's language id, for syntax highlighting
 *   extension- used when exporting the file
 *   starter  - boilerplate inserted into a new file
 */
export const LANGUAGES = {
    c: {
        label: 'C',
        short: 'C',
        color: '#8fa6c8',
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
        short: 'C++',
        color: '#f06292',
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
        short: 'C#',
        color: '#6fcf5f',
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
        short: 'Go',
        color: '#29beb0',
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
        short: 'Jv',
        color: '#f0a04b',
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
        short: 'JS',
        color: '#f1e05a',
        judge0Id: 63,
        monaco: 'javascript',
        extension: 'js',
        starter: `console.log("Hello World!");`
    },

    kotlin: {
        label: 'Kotlin',
        short: 'Kt',
        color: '#a97bff',
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
        short: 'Lua',
        color: '#6c8cff',
        judge0Id: 64,
        monaco: 'lua',
        extension: 'lua',
        starter: `print("Hello World!")`
    },

    php: {
        label: 'PHP',
        short: 'PHP',
        color: '#9a9fe6',
        judge0Id: 68,
        monaco: 'php',
        extension: 'php',
        starter: `<?php

echo "Hello World!\\n";
`
    },

    python: {
        label: 'Python',
        short: 'Py',
        color: '#5aa5e6',
        judge0Id: 71,
        monaco: 'python',
        extension: 'py',
        starter: `print("Hello World!")`
    },

    ruby: {
        label: 'Ruby',
        short: 'Rb',
        color: '#ef5b5b',
        judge0Id: 72,
        monaco: 'ruby',
        extension: 'rb',
        starter: `puts "Hello World!"`
    },

    rust: {
        label: 'Rust',
        short: 'Rs',
        color: '#dea584',
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
        short: 'Sc',
        color: '#ff7a6b',
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
        short: 'Sh',
        color: '#89e051',
        judge0Id: 46,
        monaco: 'shell',
        extension: 'sh',
        starter: `echo "Hello World!"`
    },

    swift: {
        label: 'Swift',
        short: 'Sw',
        color: '#f7894a',
        judge0Id: 83,
        monaco: 'swift',
        extension: 'swift',
        starter: `print("Hello World!")`
    },

    typescript: {
        label: 'TypeScript',
        short: 'TS',
        color: '#3f8ff0',
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

export const languageMeta = (language) => {
    const config = LANGUAGES[language];
    return {
        label: config?.label ?? language ?? 'Unknown',
        short: config?.short ?? '?',
        color: config?.color ?? '#9b9ba6'
    };
};
