import React, { useRef, useState } from "react";
import { Menu } from "semantic-ui-react";
import { observer } from "mobx-react";
import * as Monaco from "monaco-editor";

import style from "./TabbedEditor.module.less";

import { useIntlMessage } from "@/utils/hooks";
import CodeEditor from "@/components/CodeEditor";
import HorizontalScroll from "@/components/HorizontalScroll";

interface TabbedEditorTab {
  title: string;
  icon: string;
  language: string;
  initialContent: string;
}

interface TabbedEditorProps {
  tabs: TabbedEditorTab[];
  refSetValue?: React.MutableRefObject<(tabIndex: number, value: string) => void>;
  onChange: (tabIndex: number, value: string) => void;
}

let TabbedEditor: React.FC<TabbedEditorProps> = props => {
  const _ = useIntlMessage("problem");

  // Without a ref wrapper, props.onChange() will call the outdated old callback function
  // which is binded with the outdated states of the parent component
  const refOnChangeCallback = useRef<typeof props.onChange>();
  refOnChangeCallback.current = props.onChange;

  const refTabStates = useRef<
    {
      model: Monaco.editor.ITextModel;
      viewState: Monaco.editor.ICodeEditorViewState;
    }[]
  >(
    props.tabs.map((tab, i) => {
      const model = Monaco.editor.createModel(tab.initialContent, tab.language);
      model.onDidChangeContent(() => refOnChangeCallback.current(i, model.getValue()));
      return {
        model,
        viewState: null
      };
    })
  );

  if (props.refSetValue)
    props.refSetValue.current = (tabIndex: number, value: string) =>
      refTabStates.current[tabIndex].model.setValue(value);

  const refEditor = useRef<Monaco.editor.IStandaloneCodeEditor>();

  function editorDidMount(editor: Monaco.editor.IStandaloneCodeEditor) {
    refEditor.current = editor;
    editor.setModel(refTabStates.current[0]?.model);
  }

  const [currentTabIndex, setCurrentTabIndex] = useState(0);

  function onChangeTab(index: number) {
    if (index === currentTabIndex) return;

    refTabStates.current[currentTabIndex].viewState = refEditor.current.saveViewState();
    refEditor.current.setModel(refTabStates.current[index].model);
    refEditor.current.restoreViewState(refTabStates.current[index].viewState);

    setCurrentTabIndex(index);
  }

  return (
    <div className={style.tabbedEditor}>
      <HorizontalScroll className={style.tabMenuContainer}>
        <Menu secondary className={style.tabMenu}>
          {props.tabs.map((tab, i) => (
            <Menu.Item
              key={i}
              active={currentTabIndex === i}
              icon={tab.icon}
              content={tab.title}
              onClick={() => onChangeTab(i)}
            />
          ))}
        </Menu>
      </HorizontalScroll>
      <div className={style.wrapper}>
        <CodeEditor editorDidMount={editorDidMount} value={null} language={null} />
      </div>
    </div>
  );
};

TabbedEditor = observer(TabbedEditor);

export default TabbedEditor;
