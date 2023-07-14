import React, { useEffect, useState, useContext, useRef } from "react"
import { useParams } from "react-router-dom"
import Fireworks from "@fireworks-js/react"
import RoomHeader from "./components/RoomHeader"
import RoomBody from "./components/RoomBody"
import RoomFooter from "./components/RoomFooter"
import LoginAsGuest from "../LoginAsGuest"
import { getRoomById } from "../../api/services/roomService"
import { getUserById } from "../../api/services/userService"
import { RoomContext } from "../../context/roomContext"
import { SocketContext } from "../../context/SocketContext"
import { ROOM_DEFAULT_NAME, ROOM_STATUS } from "../../constants/roomConst"
import SOCKET_EVENT from "../../constants/socket_event"
import IssueContextProvider from "../../context/issueContext"
import Issues from "./components/Issues"
import "./PlanningRoom.css"

const FIREWORK_Z_INDEX_ON = 0
const FIREWORK_Z_INDEX_OFF = -1

function PlanningRoom() {
  const { room, setRoom, setUsers } = useContext(RoomContext)
  const { socket } = useContext(SocketContext)

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const [voteResult, setVoteResult] = useState(null)
  const [fireworkIndex, setFireWorkIndex] = useState(FIREWORK_Z_INDEX_OFF)

  const fireworkRef = useRef()

  const { id } = useParams()

  const toggleOffCanvas = () => {
    setIsOpen(!isOpen)
  }

  useEffect(() => {
    socket.on(SOCKET_EVENT.ROOM.REVEAL, (data) => {
      setVoteResult(data)
      setIsRevealed(true)
    })
    socket.on(SOCKET_EVENT.ROOM.START, () => {
      setIsRevealed(false)
    })
  }, [])

  const getGameName = async () => {
    const res = await getRoomById(id)
    const { voting, currentResults, ...roomData } = res.data
    setRoom(roomData)
    setUsers(voting)
    setVoteResult(currentResults)
  }

  const checkUserLoggedIn = async () => {
    const userId = localStorage.getItem("userId")
    if (userId) {
      const res = await getUserById(userId)
      if (res.success) {
        setIsLoggedIn(true)
      }
    }
  }

  useEffect(() => {
    checkUserLoggedIn()
    getGameName()
  }, [id])

  useEffect(() => {
    if (room) setIsRevealed(room.status === ROOM_STATUS.CONCLUDED)
  }, [room])

  useEffect(() => {
    if (!fireworkRef.current) return

    if (isRevealed) {
      if (!fireworkRef.current.isRunning) {
        fireworkRef.current.start()
      }
      setFireWorkIndex(FIREWORK_Z_INDEX_ON)
    } else {
      if (fireworkRef.current.isRunning) {
        fireworkRef.current.stop()
      }
      setFireWorkIndex(FIREWORK_Z_INDEX_OFF)
    }
  }, [isRevealed])

  const widthClassName = isOpen ? "room__container--offcanvas" : "w-100"

  return (
    room && (
      <div className="room">
        {!isLoggedIn && <LoginAsGuest isLoggedIn={isLoggedIn} />}
        <div
          className={`room__container vh-100 d-flex flex-column justify-content-between ${widthClassName}`}
        >
          <RoomHeader
            gameName={room.name || ROOM_DEFAULT_NAME}
            toggleOffCanvas={toggleOffCanvas}
          />
          <RoomBody isRevealed={isRevealed} />
          <RoomFooter
            votingSystem={room.votingSystem}
            isRevealed={isRevealed}
            voteResult={voteResult}
          />
        </div>
        <IssueContextProvider>
          <Issues isOpen={isOpen} toggleOffCanvas={toggleOffCanvas} />
        </IssueContextProvider>
        <Fireworks
          ref={fireworkRef}
          options={{
            opacity: 0.5,
          }}
          style={{
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            position: "fixed",
            zIndex: fireworkIndex,
            background: "transparent",
          }}
        />
      </div>
    )
  )
}

export default PlanningRoom
