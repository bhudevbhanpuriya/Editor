import { createContext, useContext, useEffect, useState } from "react";
// import { } from "react";
import { v4 } from 'uuid';
import { ModelContext } from "./ModelProvider";

export const PlaygroundContext = createContext();
const intialData = [
    {
        id: v4(),
        title: 'DSA',
        files: [
            {
                id: v4(),
                title: 'index',
                code: `#include <bits/stdc++.h>
                        using namespace std;

                        int main() {
                            cout << "Hello Remiss!";
                            return 0;
                        }
                        `,
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
                language: 'jabascript'
            }
        ]

    }
]

export const defaultCode = {
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    cout << "Hello Remiss!";
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
        if (localData) {
            try {
                const parsed = JSON.parse(localData);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {
                console.warn("Invalid localStorage data → resetting");
            }
            localStorage.removeItem('data');
        }
        return intialData;
    });

    const createNewFolder = (newFolder) => {
        const { folderName } = newFolder;
        const newFolders = [...folders];
        newFolders.push({
            id: v4(),
            title: folderName,
            files: []
        })
        localStorage.setItem('data', JSON.stringify(newFolders));
        setFolders(newFolders)
    }

    const createNewFile = (newFileName, language, folderId) => {
        const newFile = {
            id: v4(),
            title: newFileName,
            code: defaultCode[language],
            language: language
        }

        const updatedFolders = folders.map(folder => {
            if (folder.id === folderId) {
                return {
                    ...folder,
                    files: [...folder.files, newFile]
                };
            }
            return folder;
        });


        localStorage.setItem('data', JSON.stringify(updatedFolders));
        setFolders(updatedFolders);
    }


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

    const deleteFolder = (id) => {
        const updatedFolderList = folders.filter((folderItem) => {
            return folderItem.id !== id;
        })

        localStorage.setItem('data', JSON.stringify(updatedFolderList));
        setFolders(updatedFolderList);
    }

    const deleteFile = (id) => {
        const updatedFolderList = folders.map((folderItem) => {
            const updatedFiles = folderItem.files
                ?.filter((fileItem) => fileItem !== null && fileItem.id !== id);

            return {
                ...folderItem,
                files: updatedFiles
            };
        });
        setFolders(updatedFolderList);
        localStorage.setItem("data", JSON.stringify(updatedFolderList));

    }


    const renameFolder = (newFolderName, id) => {
        const updatedFolderList = folders.map((folderItem) => {
            if (folderItem.id === id) {
                folderItem.title = newFolderName;
            }
            return folderItem;
        });
        localStorage.setItem("data", JSON.stringify(updatedFolderList));
        setFolders(updatedFolderList);
    };

    
    const renameFile = (newFileName, folderId, fileId) => {
        for (let i = 0; i < folders.length; i++) {
            if (folders[i].id === folderId) {
                const files = folders[i].files;

                for (let j = 0; j < files.length; j++) {
                    if (files[j].id === fileId) {
                        files[j].title = newFileName;
                        break;
                    }
                }
                break;
            }
        }

        const updated = [...folders];
        setFolders(updated);
        localStorage.setItem("data", JSON.stringify(updated));
    };

    const updateFileCode = (folderId, fileId, newCode) => {
        const updated = folders.map(folder => {
            if (folder.id === folderId) {
                return {
                    ...folder,
                    files: folder.files.map(file =>
                        file.id === fileId ? { ...file, code: newCode } : file
                    )
                };
            }
            return folder;
        });

        setFolders(updated);
        localStorage.setItem("data", JSON.stringify(updated));
    };



    useEffect(() => {
        if (!localStorage.getItem('data')) {
            localStorage.setItem('data', JSON.stringify(folders));
        }
    }, [])

    const playgroundFeatures = {
        folders,
        createNewPlayground,
        createNewFolder,
        deleteFolder,
        renameFolder,
        renameFile,
        deleteFile,
        createNewFile,
        updateFileCode
    }

    return (
        <PlaygroundContext.Provider value={playgroundFeatures}>
            {children}
        </PlaygroundContext.Provider>
    );
}