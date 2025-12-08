"use client";

import {
  BasicTextStyleButton,
  BlockTypeSelect,
  CreateLinkButton,
  FileCaptionButton,
  FileReplaceButton,
  FormattingToolbar,
  FormattingToolbarController,
  TextAlignButton,
} from "@blocknote/react";

export function BlockNoteEditorFormattingToolbar() {
  return (
    <FormattingToolbarController
      formattingToolbar={() => (
        <FormattingToolbar>
          <BlockTypeSelect key={"blockTypeSelect"} />

          <FileCaptionButton key={"fileCaptionButton"} />
          <FileReplaceButton key={"replaceFileButton"} />

          <BasicTextStyleButton basicTextStyle={"bold"} key={"boldStyleButton"} />
          <BasicTextStyleButton basicTextStyle={"italic"} key={"italicStyleButton"} />
          <BasicTextStyleButton basicTextStyle={"underline"} key={"underlineStyleButton"} />
          <BasicTextStyleButton basicTextStyle={"strike"} key={"strikeStyleButton"} />

          <TextAlignButton textAlignment={"left"} key={"textAlignLeftButton"} />
          <TextAlignButton textAlignment={"center"} key={"textAlignCenterButton"} />
          <TextAlignButton textAlignment={"right"} key={"textAlignRightButton"} />

          <CreateLinkButton key={"createLinkButton"} />
        </FormattingToolbar>
      )}
    />
  );
}
