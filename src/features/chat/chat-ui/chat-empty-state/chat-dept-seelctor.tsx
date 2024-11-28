import { FC } from "react";
import { ChatDoc } from "../../chat-services/models";
import { useChatContext } from "../chat-context";
import { useSession } from "next-auth/react";
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Prop {
  disable: boolean;
}

const chatDocLabels: Record<ChatDoc, string> = {
  all: "すべての部門",
  it: "ITヘルプデスク",
  hr: "人事",
  fi: "経理",
  sales: "みんなび"
};

export const ChatDeptSelector: FC<Prop> = (props) => {
  const { data: session } = useSession();
  const { chatBody, onChatDocChange } = useChatContext();

  return (
    <FormControl>
      <RadioGroup
        row
        aria-labelledby="dept-group-label"
        defaultValue="all"
        name="radio-buttons-group"
        className="justify-end"
        onChange={(event) => onChatDocChange(event.target.value as ChatDoc)}
      >
        <FormControlLabel
          value="all"
          control={<Radio />}
          label={<span className="text-sm text-muted-foreground">すべて</span>}
        />
        <FormControlLabel
          value="it"
          control={<Radio />}
          label={<span className="text-sm text-muted-foreground">最新の機構マニュアル</span>}
        />
        <FormControlLabel
          value="hr"
          control={<Radio />}
          label={<span className="text-sm text-muted-foreground">機構マニュアルバックログ</span>}
        />
        <FormControlLabel
          value="fi"
          control={<Radio />}
          label={<span className="text-sm text-muted-foreground">社内規定</span>}
        />
        <FormControlLabel
          value="sales"
          control={<Radio />}
          label={<span className="text-sm text-muted-foreground">その他</span>}
        />
      </RadioGroup>
      <div className="mt-2 text-center text-sm text-gray-600">
        {chatDocLabels[chatBody.chatDoc]}からデータを検索します
      </div>
    </FormControl>
  );
};