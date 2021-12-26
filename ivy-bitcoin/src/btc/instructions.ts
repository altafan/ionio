import { createTypeSignature, TypeSignature } from "./types"

export type ComparisonOperator = "==" | "!="
export type ConcatenationOperator = "+"
export type ArithmeticOperator = "*" | "/" | "-" | "+"
export type NullaryOperator =
  | "tx.version"
  | "tx.locktime"
  | "tx.weight"
  | "tx.inputs.length"
  | "tx.outputs.length"

export function isComparisonOperator(str: string): str is ComparisonOperator {
  return ["==", "!="].indexOf(str) !== -1
}

export function isNullaryOperator(str: string): str is NullaryOperator {
  switch (str) {
    case "tx.version":
    case "tx.locktime":
    case "tx.weight":
    case "tx.inputs.length":
    case "tx.outputs.length":
      return true
    default:
      return false
  }
}

export type FunctionName =
  | "checkSig"
  | "ripemd160"
  | "sha1"
  | "sha256"
  | "older"
  | "after"
  | "checkMultiSig"
  | "bytes"
  | "size"
  | "checkSigFromStack"

export type Opcode = string // for now

export type BinaryOperator = ComparisonOperator | ConcatenationOperator | ArithmeticOperator

export type Instruction = BinaryOperator | FunctionName | NullaryOperator

// slightly hackish runtime type guard

export function isInstruction(
  instructionName: Instruction | string
): instructionName is Instruction {
  const opcodes = getOpcodes(instructionName as Instruction)
  return opcodes !== undefined
}

export function getOpcodes(instruction: Instruction): Opcode[] {
  switch (instruction) {
    case "checkSig":
      return ["CHECKSIG"]
    case "ripemd160":
      return ["RIPEMD160"]
    case "sha1":
      return ["SHA1"]
    case "sha256":
      return ["SHA256"]
    case "older":
      return ["CHECKSEQUENCEVERIFY", "DROP", "1"] // will get special treatment
    case "after":
      return ["CHECKLOCKTIMEVERIFY", "DROP", "1"] // will get special treatment
    case "checkMultiSig":
      return ["CHECKMULTISIG"] // will get special treatment
    case "==":
      return ["EQUAL"]
    case "!=":
      return ["EQUAL", "NOT"]
    case "bytes":
      return []
    case "size":
      return ["SIZE", "SWAP", "DROP"]
    case "+":
      return ["CAT"]
    case "checkSigFromStack":
      return ["CHECKSIGFROMSTACK"] // will get special treatment
    case "tx.version":
      return ["INSPECTVERSION"]
    case "tx.locktime":
      return ["INSPECTLOCKTIME"]
    case "tx.weight":
      return ["TXWEIGHT"]
    case "tx.inputs.length":
      return ["INSPECTNUMINPUTS"]
    case "tx.outputs.length":
      return ["INSPECTNUMOUTPUTS"]
    default:
      return []
  }
}

export function getTypeSignature(instruction: Instruction): TypeSignature {
  switch (instruction) {
    case "checkSig":
      return createTypeSignature(["PublicKey", "Signature"], "Boolean")
    case "older":
      return createTypeSignature(["Duration"], "Boolean")
    case "after":
      return createTypeSignature(["Time"], "Boolean")
    case "size":
      return createTypeSignature(["Bytes"], "Integer")
    case "checkMultiSig":
      return createTypeSignature(
        [
          { type: "listType", elementType: "PublicKey" },
          { type: "listType", elementType: "Signature" }
        ],
        "Boolean"
      )
    case "checkSigFromStack":
      return createTypeSignature(
        [
          "DataSignature",
          "Bytes",
          "PublicKey"
        ],
        "Boolean"
      )

    // introspection
    case "tx.version":
      return createTypeSignature([], "Bytes")
    case "tx.locktime":
    case "tx.weight":
    case "tx.inputs.length":
    case "tx.outputs.length":
      throw new Error("not implemented yet")
    case "+":
      throw new Error("should not call getTypeSignature on +")
    case "==":
    case "!=":
      throw new Error("should not call getTypeSignature on == or !=")
    case "ripemd160":
    case "sha1":
    case "sha256":
      throw new Error("should not call getTypeSignature on hash function")
    case "bytes":
      throw new Error("should not call getTypeSignature on bytes function")


    default:
      throw new Error("not supported instruction")
  }
}
