import { Switch } from './switch/switch';
import { RadioGroup } from './radio/radio';
import { CheckboxGroup } from './checkbox/checkbox';
import { CardInput } from './card/card';
import { DateInput } from './date/date';
import { Input } from './input';
import { Textarea } from './textarea';
import { Select } from './select/select';
import { OTP } from './otp/otp';
import { FileInput } from './file/file';

export default  {
  radio: { 
    component: RadioGroup,
    showIcon: false,
    showLabel: true,
  },
  date: {
    component: DateInput,
    showIcon: true,
    showLabel: true
  },
  checkbox: {
    component: CheckboxGroup,
    showIcon: false,
    showLabel: true,
  },
  select: {
    component: Select,
    showIcon: false,
    showLabel: true,
  },
  file: {
    component: FileInput,
    showIcon: false,
    showLabel: true,
  },
  textarea: {
    component: Textarea,
    showIcon: true,
    showLabel: true,
  },
  switch: {
    component: Switch,
    showIcon: false,
    showLabel: false,
  },
  creditcard: {
    component: CardInput,
    showIcon: false,
    showLabel: true,
  },
  email: {
    component: Input,
    showIcon: true,
    showLabel: true,
    validation: {
      default: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    }
  },
  number: {
    component: Input,
    showIcon: true,
    showLabel: true,
    validation: {
      default: /^\s*-?\d+(\.\d+)?\s*$/
    }
  },
  phone: {
    component: Input,
    showIcon: true,
    showLabel: true,
    validation: {
      default: /^\+?(?:[0-9] ?){6,14}[0-9]$/
    }
  },
  url: {
    component: Input,
    showIcon: true,
    showLabel: true,
    validation: {
      default: /^((https?|ftp|smtp):\/\/)?(www.)?[a-z0-9-]+(\.[a-z-]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/
    }
  },
  password: {
    component: Input,
    showIcon: true,
    showLabel: true,
    validation: {
      complex:  /^(?=.*[!@#$%^&*(),.?":{}|<>]).*$/
    }
  },
  otp: {
    component: OTP,
    showIcon: false,
    showLabel: true,
  },
  default: {
    component: Input,
    showIcon: true,
    showLabel: true,
  },
}