local p = nil
local secret = nil

local function Circle(cb, circles, seconds)
    if circles == nil or circles < 1 then circles = 1 end
    if seconds == nil or seconds < 1 then seconds = 10 end
    secret = math.random(1000)
    p = promise.new()
    SendNUIMessage({
        action = 'circle-start',
        circles = circles,
		time = seconds,
        secret = secret,
    })
    SetNuiFocus(true, true)
    local result = Citizen.Await(p)
    cb(result)
end
exports("Circle", Circle)

RegisterNUICallback('circle', function(data, cb)
    if data.secret == secret then
        if data.status == 'success' then
            p:resolve(true)
        elseif data.status == 'fail' then
            p:resolve(false)
        end
        p = nil
        secret = nil
        SetNuiFocus(false, false)
        cb('ok')
    end
end)