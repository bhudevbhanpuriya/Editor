import { createContext, useContext, useEffect, useState } from "react";
// import { } from "react";
import { v4 } from 'uuid';
export const PlaygroundContext = createContext();
const intialData = [
    {
        id: v4(),
        title: 'DSA',
        files: [
            {
                id: v4(),
                title: 'index',
                code: 'cout<<"Hello bhu1"<<endl',
                language: 'cpp'
            }
        ]

    },

    {
        id: v4(),
        title: 'Web-dev',
        files: [
            {
                id: v4(),
                title: 'homepage',
                code: 'console.log("Hello bhu1");',
                language: 'cpp'
            }
        ]

    }
]

const defaultCode = {
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    cout << "Hello World!";
    return 0;
}
`,

    java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World!");
    }
}
`,

    javascript: `console.log("Hello World!");`,

    python: `print("Hello World!")`
};


export const PlayGroundProvider = ({ children }) => {
    const [folders, setFolders] = useState(() => {
        const localData = localStorage.getItem('data');
        if(localData){
            return JSON.parse(localData);
        }
        return intialData;
    });

    const createNewPlayground = (newPlayground) => {
        const { folderName, fileName, language } = newPlayground
        const newFolders = [...folders];
        newFolders.push({
            id: v4(),
            title: folderName,
            files: [
                {
                    id: v4(),
                    title: fileName,
                    code: defaultCode[language],
                    language: language
                }
            ]
        })
        localStorage.setItem('data', JSON.stringify(newFolders));
        setFolders(newFolders)
    }

    useEffect(() => {
        if (!localStorage.getItem('data')) {
            localStorage.setItem('data', JSON.stringify(folders));

        }
    }, [])

    const playgroundFeatures = {
        folders,
        createNewPlayground
    }

    return (
        <PlaygroundContext.Provider value={playgroundFeatures}>
            {children}
        </PlaygroundContext.Provider>
    );
}