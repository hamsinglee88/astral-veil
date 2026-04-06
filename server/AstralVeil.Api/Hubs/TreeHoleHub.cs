using Microsoft.AspNetCore.SignalR;

namespace AstralVeil.Api.Hubs;

/// <summary>
/// 树洞群聊实时广播；Story 6.1 不落库，Story 6.2 起可由 REST 写库后改由同一套 payload 广播。
/// </summary>
public sealed class TreeHoleHub : Hub
{
    public const int MaxTextLength = 2000;

    public static string GroupNameForRoom(string roomId) => $"room-{roomId.Trim()}";

    /// <summary>加入房间组，与「星河大厅」等产品房间 id 对齐（如 lobby）。</summary>
    public async Task JoinRoom(string roomId)
    {
        if (string.IsNullOrWhiteSpace(roomId) || roomId.Length > 64)
            throw new HubException("INVALID_ROOM");
        await Groups.AddToGroupAsync(Context.ConnectionId, GroupNameForRoom(roomId));
    }

    /// <summary>向房间内其他连接广播新消息（不含发送方，由前端乐观更新）。</summary>
    public async Task SendMessage(string roomId, string text, int category)
    {
        if (string.IsNullOrWhiteSpace(roomId) || roomId.Length > 64)
            throw new HubException("INVALID_ROOM");
        text = text.Trim();
        if (text.Length == 0 || text.Length > MaxTextLength)
            throw new HubException("INVALID_TEXT");
        if (category is < 1 or > 3)
            category = 1;

        var id = Guid.NewGuid().ToString("N");
        var suffix = Context.ConnectionId.Length >= 4
            ? Context.ConnectionId[^4..]
            : Context.ConnectionId;
        var author = $"匿名·{suffix}";
        var timeIso = DateTimeOffset.UtcNow.ToString("O");

        var payload = new TreeHoleMessagePayload(id, author, text, category, timeIso, false);
        await Clients.OthersInGroup(GroupNameForRoom(roomId)).SendAsync("NewMessage", payload);
    }
}

/// <summary>与前端 TreeHoleMessage 形状对齐（camelCase JSON）。</summary>
public sealed record TreeHoleMessagePayload(
    string Id,
    string Author,
    string Text,
    int Category,
    string Time,
    bool Self);
