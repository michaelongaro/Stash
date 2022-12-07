import React from "react";

import CreateSelectable from "react-select/creatable";

import { type ICreateSelectableOptions, type IFile } from "./ImageReviewModal";

interface ICreateableFolderDropdown {
  index: number;
  createSelectableFolders: ICreateSelectableOptions[];
  setCreateSelectableFolders: React.Dispatch<
    React.SetStateAction<ICreateSelectableOptions[]>
  >;
  folderOptions: ICreateSelectableOptions[];
  setFolderOptions: React.Dispatch<
    React.SetStateAction<ICreateSelectableOptions[]>
  >;
  imageData: IFile[];
  setImageData: React.Dispatch<React.SetStateAction<IFile[]>>;
}

function CreateableFolderDropdown({
  index,
  createSelectableFolders,
  setCreateSelectableFolders,
  folderOptions,
  setFolderOptions,
  imageData,
  setImageData,
}: ICreateableFolderDropdown) {
  return (
    <CreateSelectable
      isClearable
      styles={{
        option: (baseStyles, state) => ({
          ...baseStyles,
          color: "#1e3a8a",
        }),
      }}
      options={folderOptions}
      onChange={(newFolder) => {
        if (newFolder?.label) {
          // updating image data
          const newImageData = [...imageData];
          newImageData[index]!.folder = {
            title: newFolder.label,
            id:
              newFolder.value !== newFolder.label ? newFolder.value : undefined,
          };
          setImageData(newImageData);

          // updating list of folders in dropdown
          if (folderOptions.every((elem) => elem.label !== newFolder.label)) {
            // making sure folder isn't already present)
            const newFolderOptions = [...folderOptions];
            newFolderOptions[newFolderOptions.length] = {
              label: newFolder.label,
              value: newFolder.value,
            };
            setFolderOptions(newFolderOptions);
          }

          // updating value of dropdown
          const newFolderData = [...createSelectableFolders];
          newFolderData[index] = {
            label: newFolder.label,
            value: newFolder.value,
          };
          setCreateSelectableFolders(newFolderData);
        } else {
          // deleting folder from image data
          const newImageData = [...imageData];
          delete newImageData[index]?.folder;
          setImageData(newImageData);

          // want to uncomment below once you have functionality to fully delete folder from this menu
          // (assuming you want that funcitonality)
          // const newFolderOptions = [...folderOptions];
          // delete newFolderOptions[index];
          // setFolderOptions(newFolderOptions);

          // deleting folder from dropdown value
          const newFolderData = [...createSelectableFolders];
          delete newFolderData[index];
          setCreateSelectableFolders(newFolderData);
        }
      }}
      value={createSelectableFolders[index] ?? null}
      placeholder="Optional"
    />
  );
}

export default CreateableFolderDropdown;
